output "state_bucket_name" {
  value = aws_s3_bucket.tf_state.bucket
}

output "dynamodb_lock_table" {
  value = aws_dynamodb_table.tf_locks.name
}
