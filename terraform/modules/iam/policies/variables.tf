variable "name_prefix" {
  type = string
}

variable "queue_arn" {
  type = string
}

variable "media_bucket_arn" {
  type = string
}

variable "encoded_bucket_arn" {
  type = string
}

variable "encoder_task_definition_arn" {
  type = string
}

variable "lambda_role_name" {
  type = string
}

variable "ecs_task_role_name" {
  type = string
}

variable "secret_arn" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
