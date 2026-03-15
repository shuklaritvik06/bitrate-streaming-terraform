data "archive_file" "this" {
  type        = "zip"
  source_dir  = local.source_dir
  output_path = "/tmp/${local.function_name}.zip"
}

resource "aws_lambda_function" "this" {
  function_name    = local.function_name
  role             = var.lambda_role_arn
  handler          = "push-to-sqs.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.this.output_path
  source_code_hash = data.archive_file.this.output_base64sha256
  timeout          = 900

  environment {
    variables = {
      QUEUE_URL = var.queue_url
    }
  }

  tags = merge(var.tags, { Name = local.function_name })
}

resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.media_bucket_arn
}
