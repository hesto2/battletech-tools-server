provider "aws" {
  region = "us-west-2"
}

terraform {
  backend "s3" {
    bucket         = "hesto2-terraform-state"
    key            = "terraform"
    region         = "us-west-2"
    dynamodb_table = "terraform-lock"
  }
}
data "terraform_remote_state" "hesto2_infrastructure" {
  backend = "s3"
  config = {
    bucket = "hesto2-terraform-state"
    key = "terraform"
    region="us-west-2"
    dynamodb_table = "terraform-lock"
  }
}