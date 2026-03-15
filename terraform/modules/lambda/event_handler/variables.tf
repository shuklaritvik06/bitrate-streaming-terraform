variable "name_prefix" {
  type = string
}

variable "lambda_role_arn" {
  type = string
}

variable "queue_url" {
  type = string
}

variable "media_bucket_arn" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
