kubectl delete -f k8s/ && \
git pull && \
docker build -t algolov-server . && \
docker tag algolov-server ulysseguyon/algolov-server:latest && \
docker push ulysseguyon/algolov-server:latest && \
kubectl apply -f k8s/