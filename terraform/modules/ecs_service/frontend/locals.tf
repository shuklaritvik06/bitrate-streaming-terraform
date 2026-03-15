locals {
  service_name   = "${var.name_prefix}-frontend-service"
  task_family    = "${var.name_prefix}-frontend-task"
  container_name = "${var.name_prefix}-frontend-container"
}
