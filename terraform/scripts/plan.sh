#!/bin/bash
set -euo pipefail
ENV=${1:-dev}
cd "$(dirname "$0")/../environments/${ENV}"
terraform init -reconfigure
terraform plan -var-file="terraform.tfvars"
