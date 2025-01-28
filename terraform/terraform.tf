provider "aws" {
  region = "us-west-2"
}
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

terraform {
  backend "s3" {
    bucket         = "hesto2-terraform-state-global"
    key            = "battletech-tools"
    region         = "us-west-2"
    dynamodb_table = "terraform-lock"
  }
}
data "terraform_remote_state" "hesto2_infrastructure" {
  backend = "s3"
  config = {
    bucket = "hesto2-terraform-state-global"
    key = "terraform"
    region="us-west-2"
    dynamodb_table = "terraform-lock"
  }
}