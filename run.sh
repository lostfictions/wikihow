#!/bin/bash
set -Eeuo pipefail

# every four hours, on the hour
DEFAULT_CRON_RULE='0 */4 * * *'

if [ "$#" -lt 1 ]; then
  echo "You need to pass at least one argument to the script to be executed as a rule!" >&2
  exit 1
fi

if [[ -z "${CRON_RULE-}" ]]; then
  echo "CRON_RULE not set in environment, using default rule ($DEFAULT_CRON_RULE)"
fi

CRONFILE='/etc/cron.d/mastobot'

# even though we dump the environment (which should include PATH) later in this
# script, cron seems to have trouble finding things unless we prepend the file
# with this.
echo 'PATH=/usr/local/bin:/usr/bin:/bin' > $CRONFILE

# the spooky stuff at the end is to convince cron to redirect stdout/stderr even
# in a docker container: https://stackoverflow.com/a/41409061
echo "${CRON_RULE-$DEFAULT_CRON_RULE} cd $PWD && $@ > /proc/\$(cat /var/run/crond.pid)/fd/1 2>&1" >> $CRONFILE

# cron wants a newline at the end of a file, too.
printf "\n" >> $CRONFILE

chmod +x $CRONFILE
crontab $CRONFILE

# cron doesn't have access to our container environment variables by default, so
# we just dump them to /etc/environment, as suggested here:
# https://stackoverflow.com/a/41938139
# this may pose some security concerns somehow, or might pollute the environment
# for other commands, caveat emptor, etc etc.
printenv >> /etc/environment

# finally, run cron in the foreground (-f).
cron -f
