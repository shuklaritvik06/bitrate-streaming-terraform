locals {
  org     = "ritvik"
  project = "web-streamer"
  region  = "us-west-2"
  prefix  = "${local.org}-${local.project}"
  common_tags = {
    Project   = local.project
    Org       = local.org
    ManagedBy = "terraform"
  }
}
