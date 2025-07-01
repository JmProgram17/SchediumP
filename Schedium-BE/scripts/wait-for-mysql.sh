#!/bin/bash
set -e

echo "Waiting for MySQL to be ready..."

host="$1"
port="${2:-3306}"
user="${3:-root}"
password="${4:-rootpassword}"

until mysql -h"$host" -P"$port" -u"$user" -p"$password" -e "SELECT 1" &> /dev/null
do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done

echo "MySQL is up and running!"