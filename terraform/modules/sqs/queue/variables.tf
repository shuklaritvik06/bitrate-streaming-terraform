variable "name_prefix" {
  type = string
}

variable "dlq_arn" {
  type = string
}

variable "media_bucket_arn" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}