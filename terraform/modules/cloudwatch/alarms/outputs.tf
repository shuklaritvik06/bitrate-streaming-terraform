output "dlq_alarm_arn" {
  value = aws_cloudwatch_metric_alarm.dlq_depth.arn
}