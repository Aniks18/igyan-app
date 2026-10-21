#!/bin/sh
set -eu

# Open an already-installed app without Expo's legacy Simulator.app check.
developer_dir=$(xcode-select -p)
if [ -d "$developer_dir/Applications/Simulator.app" ]; then
  open "$developer_dir/Applications/Simulator.app"
elif [ -d "$developer_dir/../Applications/DeviceHub.app" ]; then
  open "$developer_dir/../Applications/DeviceHub.app"
else
  echo 'No Simulator or Device Hub app found in the selected Xcode installation.' >&2
  exit 1
fi

if ! xcrun simctl get_app_container booted com.igyan.app app >/dev/null 2>&1; then
  echo 'Select and boot an iPhone in Xcode, and ensure iGyan is installed, then retry.' >&2
  exit 1
fi
xcrun simctl launch booted com.igyan.app
