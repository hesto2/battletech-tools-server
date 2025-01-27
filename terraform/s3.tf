resource "aws_s3_bucket" "battletech_user_data" {
  bucket = "battletech_user_data"
}

resource "aws_iam_policy" "s3_access_policy" {
  name        = "s3_access_policy"
  description = "Policy to allow Lambda function to access S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "*",
        ]
        Resource = [
          "${aws_s3_bucket.battletech_user_data.arn}",
          "${aws_s3_bucket.battletech_user_data.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_lambda_permission" "allow_lambda_s3_access" {
  statement_id  = "AllowLambdaS3Access"
  action        = "lambda:InvokeFunction"
  function_name = module.api_gateway_lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.battletech_user_data.arn
}

resource "aws_iam_role_policy_attachment" "lambda_s3_policy_attachment" {
  role       = module.api_gateway_lambda.role_name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}
