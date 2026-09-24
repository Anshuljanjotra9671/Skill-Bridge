pipeline {

    agent any

    environment {
        AWS_REGION = 'eu-north-1'
        AWS_ACCOUNT_ID = '411072614015'

        ECR_API = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/skillbridge-api"
        ECR_CLIENT = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/skillbridge-client"

        EKS_CLUSTER = 'skillbridge-eks'
        K8S_NAMESPACE = 'skillbridge'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh '''
                    set -e

                    echo "AWS:"
                    aws --version

                    echo "Docker:"
                    docker --version

                    echo "Kubectl:"
                    kubectl version --client

                    echo "Git:"
                    git --version
                '''
            }
        }

        stage('AWS Authentication') {
            steps {
                sh '''
                    set -e

                    aws sts get-caller-identity

                    aws ecr get-login-password \
                      --region ${AWS_REGION} | \
                    docker login \
                      --username AWS \
                      --password-stdin \
                      ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                    aws eks update-kubeconfig \
                      --region ${AWS_REGION} \
                      --name ${EKS_CLUSTER}

                    kubectl get nodes
                '''
            }
        }

        stage('Build API Image') {
            steps {
                sh '''
                    set -e

                    docker build \
                      -t ${ECR_API}:${GIT_COMMIT} \
                      -f Dockerfile .
                '''
            }
        }

        stage('Build Client Image') {
            steps {
                sh '''
                    set -e

                    docker build \
                      -t ${ECR_CLIENT}:${GIT_COMMIT} \
                      -f client/Dockerfile .
                '''
            }
        }

        stage('Trivy Scan API') {
            steps {
                sh '''
                    trivy image \
                      --severity HIGH,CRITICAL \
                      --exit-code 1 \
                      ${ECR_API}:${GIT_COMMIT}
                '''
            }
        }

        stage('Trivy Scan Client') {
            steps {
                sh '''
                    trivy image \
                      --severity HIGH,CRITICAL \
                      --exit-code 1 \
                      ${ECR_CLIENT}:${GIT_COMMIT}
                '''
            }
        }

        stage('Push Images to ECR') {
            steps {
                sh '''
                    set -e

                    docker push ${ECR_API}:${GIT_COMMIT}
                    docker push ${ECR_CLIENT}:${GIT_COMMIT}
                '''
            }
        }

        stage('Deploy API to EKS') {
            steps {
                sh '''
                    set -e

                    kubectl set image deployment/skillbridge-api \
                      api=${ECR_API}:${GIT_COMMIT} \
                      -n ${K8S_NAMESPACE}

                    kubectl rollout status \
                      deployment/skillbridge-api \
                      -n ${K8S_NAMESPACE} \
                      --timeout=180s
                '''
            }
        }

        stage('Deploy Client to EKS') {
            steps {
                sh '''
                    set -e

                    kubectl set image deployment/skillbridge-client \
                      client=${ECR_CLIENT}:${GIT_COMMIT} \
                      -n ${K8S_NAMESPACE}

                    kubectl rollout status \
                      deployment/skillbridge-client \
                      -n ${K8S_NAMESPACE} \
                      --timeout=180s
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e

                    echo "=== Pods ==="
                    kubectl get pods -n ${K8S_NAMESPACE}

                    echo "=== Services ==="
                    kubectl get svc -n ${K8S_NAMESPACE}

                    echo "=== API Deployment ==="
                    kubectl get deployment skillbridge-api \
                      -n ${K8S_NAMESPACE}

                    echo "=== Client Deployment ==="
                    kubectl get deployment skillbridge-client \
                      -n ${K8S_NAMESPACE}
                '''
            }
        }
    }

    post {
        success {
            echo 'SkillBridge deployed successfully to EKS.'
        }

        failure {
            echo 'Pipeline failed. Check the failed stage logs.'
        }

        always {
            sh 'docker system prune -f || true'
        }
    }
}
