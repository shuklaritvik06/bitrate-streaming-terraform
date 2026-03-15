variable "desired_count" {
  type    = number
  default = 2
}

variable "frontend_image_tag" {
  type    = string
  default = "latest"
}

variable "encoder_image_tag" {
  type    = string
  default = "latest"
}
