if [ $1 = "full" ]
then
    minikube stop && \
    kubectl config use-context minikube && \
    sudo minikube start --vm-driver=none --extra-config=kubeadm.ignore-preflight-errors=NumCPU --kubernetes-version=1.17.0
else
    kubectl delete -f k8s/ && \
fi
git pull && \
docker build -t algolov-server . && \
docker tag algolov-server ulysseguyon/algolov-server:latest && \
docker push ulysseguyon/algolov-server:latest && \
kubectl apply -f k8s/