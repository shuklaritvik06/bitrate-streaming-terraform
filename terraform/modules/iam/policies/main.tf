resource "aws_iam_policy" "lambda_sqs_ecs" {
  name = "${local.name_prefix}-lambda-sqs-ecs-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:SendMessage"]
        Resource = var.queue_arn
      },
      {
        Effect   = "Allow"
        Action   = ["ecs:RunTask", "ecs:DescribeTasks"]
        Resource = var.encoder_task_definition_arn
      },
      {
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_sqs_ecs" {
  role       = var.lambda_role_name
  policy_arn = aws_iam_policy.lambda_sqs_ecs.arn
}

resource "aws_iam_policy" "ecs_s3" {
  name = "${local.name_prefix}-ecs-s3-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${var.media_bucket_arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = "${var.encoded_bucket_arn}/*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_s3" {
  role       = var.ecs_task_role_name
  policy_arn = aws_iam_policy.ecs_s3.arn
}

resource "aws_iam_policy" "secrets_read" {
  name = "${local.name_prefix}-secrets-read-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = var.secret_arn
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_secrets" {
  role       = var.ecs_task_role_name
  policy_arn = aws_iam_policy.secrets_read.arn
}
