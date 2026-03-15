locals {
  function_name = "${var.name_prefix}-process-sqs-message"
  source_dir    = "${path.module}/../../../../services/functions/process-sqs-messages"
}