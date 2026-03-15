locals {
  function_name = "${var.name_prefix}-push-to-sqs"
  source_dir    = "${path.module}/../../../../services/functions/push-sqs-messages"
}