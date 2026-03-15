output "lambda_sqs_ecs_policy_arn" {
  value = aws_iam_policy.lambda_sqs_ecs.arn
}

output "ecs_s3_policy_arn" {
  value = aws_iam_policy.ecs_s3.arn
}
