variable "name_prefix" {
  type = string
}

variable "lambda_role_arn" {
  type = string
}

variable "queue_arn" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "encoder_sg_id" {
  type = string
}

variable "encoder_task_definition_arn" {
  type = string
}

variable "ecs_cluster_arn" {
  type = string
}

variable "stream_url" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
