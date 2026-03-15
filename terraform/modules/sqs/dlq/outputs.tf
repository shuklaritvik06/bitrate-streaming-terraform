output "dlq_arn" {
  value = aws_sqs_queue.this.arn
}

output "dlq_url" {
  value = aws_sqs_queue.this.url
}

output "dlq_name" {
  value = aws_sqs_queue.this.name
}