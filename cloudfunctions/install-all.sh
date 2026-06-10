#!/bin/bash

# 批量安装云函数依赖
cd "$(dirname "$0")"

for dir in cloudfunctions/*/; do
    if [ -f "${dir}package.json" ]; then
        echo "Installing dependencies in ${dir}..."
        cd "$dir"
        npm install
        cd - > /dev/null
    fi
done

echo "All dependencies installed!"