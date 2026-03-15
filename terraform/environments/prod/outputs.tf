output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "frontend_ecr_url" {
  value = module.ecr.repository_urls["${local.prefix}-frontend"]
}

output "encoder_ecr_url" {
  value = module.ecr.repository_urls["${local.prefix}-encoder"]
}

output "media_bucket_name" {
  value = module.media_bucket.bucket_name
}

output "encoded_bucket_name" {
  value = module.encoded_bucket.bucket_name
}

output "secret_arn" {
  value = module.secrets.secret_arn
}

output "log_group_name" {
  value = module.logs.log_group_name
}