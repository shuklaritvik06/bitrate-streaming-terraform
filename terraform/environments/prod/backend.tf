terraform {
  backend "s3" {
    bucket         = "ritvik-web-streamer-tf-state"
    key            = "prod/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "ritvik-web-streamer-tf-locks"
    encrypt        = true
  }
}
