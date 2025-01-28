variable "google_client_id" {
  description = "Google OAuth Client ID"
}
variable "google_client_secret" {
  description = "Google OAuth Client Secret"
}

module "api_gateway_lambda" {
  source                   = "./node_modules/hesto2-terraform-modules/api_gateway_lambda"
  domain_name              = "api.btt.hesto2.com"
  app_name                 = "battletech_tools_server"
  regional_certificate_arn = data.terraform_remote_state.hesto2_infrastructure.outputs.hesto2_regional_certificate_arn
  route53_zone_id          = data.terraform_remote_state.hesto2_infrastructure.outputs.hesto2_zone_id
  filename                 = "deploy.zip"
  lambda_environment_variables = {
    NODE_ENV                   = "production"
    GOOGLE_OAUTH_CLIENT_ID     = "${var.google_client_id}"
    GOOGLE_OAUTH_CLIENT_SECRET = "${var.google_client_secret}"
    GOOGLE_OAUTH_REDIRECT_URI  = "https://api.btt.hesto2.com/oauthredirect"

  }
}

resource "aws_iam_role_policy_attachment" "attachment" {
  role       = module.api_gateway_lambda.role_name
  policy_arn = aws_iam_policy.iam_policy.arn
}
resource "aws_iam_policy" "iam_policy" {
  path = "/"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
        "Effect": "Allow",
        "Action": [
            "s3:*"
        ],
        "Resource": "arn:aws:s3:::*"
    },
    {
          "Sid": "AllowInvokeLambda",
          "Effect": "Allow",
          "Action": "lambda:InvokeFunction",
          "Resource": "arn:aws:lambda:*"
      }
  ]
}
EOF
}
