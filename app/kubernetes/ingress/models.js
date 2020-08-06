export function KubernetesIngress() {
  return {
    Name: '',
    Namespace: '',
    Rules: [],
    IngressClassName: '',
  };
}

export function KubernetesIngressRule() {
  return {
    ServiceName: '',
    Host: '',
    IP: '',
    Port: '',
    Path: '',
  };
}
