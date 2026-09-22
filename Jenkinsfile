pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '10'))
        timeout(time: 45, unit: 'MINUTES')
    }

    parameters {
        booleanParam(name: 'DEPLOY', defaultValue: false,
            description: 'Provision/update EC2 and deploy the application. Leave disabled for CI-only builds.')
        string(name: 'AWS_KEY_NAME', defaultValue: '',
            description: 'Existing EC2 key-pair name. Required only when DEPLOY is enabled.')
        string(name: 'ADMIN_CIDR', defaultValue: '',
            description: 'CIDR allowed to SSH to EC2, e.g. 203.0.113.10/32. Required only when DEPLOY is enabled.')
        string(name: 'EC2_SSH_USER', defaultValue: 'ec2-user',
            description: 'SSH user for the Amazon Linux EC2 instance.')
    }

    environment {
        APP_NAME             = 'skillbridge'
        SONARQUBE_SERVER     = 'SonarQube'
        SONAR_TOKEN_CRED     = 'sonarqube-token'
        AWS_CREDENTIALS      = 'aws-credentials'
        EC2_SSH_CREDENTIALS  = 'ec2-ssh-private-key'
        PROD_ENV_CREDENTIALS = 'skillbridge-production-env'
        TF_IN_AUTOMATION     = 'true'
        API_IMAGE            = 'skillbridge-api'
        CLIENT_IMAGE         = 'skillbridge-client'
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
                script {
                    env.IMAGE_TAG = "${env.BRANCH_NAME ?: 'local'}-${env.BUILD_NUMBER}".replaceAll('[^A-Za-z0-9_.-]', '-')
                }
            }
        }

        stage('Install dependencies') {
            steps {
                sh '''#!/usr/bin/env bash
                    set -euo pipefail
                    npm ci
                    npm ci --prefix client
                    npm ci --prefix server
                '''
            }
        }

        stage('Build client') {
            steps {
                sh '''#!/usr/bin/env bash
                    set -euo pipefail
                    npm run build --prefix client
                '''
            }
        }

        stage('SonarQube analysis') {
            steps {
                withSonarQubeEnv(installationName: "${SONARQUBE_SERVER}", credentialsId: "${SONAR_TOKEN_CRED}") {
                    sh '''#!/usr/bin/env bash
                        set -euo pipefail
                        sonar-scanner \
                          -Dsonar.projectKey=skillbridge \
                          -Dsonar.projectName=SkillBridge \
                          -Dsonar.sources=client/src,server \
                          -Dsonar.exclusions=**/node_modules/**,client/dist/** \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    '''
                }
            }
        }

        stage('SonarQube quality gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('OWASP Dependency-Check') {
            steps {
                sh '''#!/usr/bin/env bash
                    set -euo pipefail
                    rm -rf reports/dependency-check
                    mkdir -p reports/dependency-check
                    dependency-check.sh \
                      --project "SkillBridge" \
                      --scan . \
                      --exclude "./node_modules/**" \
                      --exclude "./client/node_modules/**" \
                      --exclude "./server/node_modules/**" \
                      --format "HTML" --format "JUNIT" \
                      --out reports/dependency-check \
                      --failOnCVSS 7
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'reports/dependency-check/dependency-check-junit.xml'
                    archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/dependency-check/**'
                }
            }
        }

        stage('Build container images') {
            steps {
                sh '''#!/usr/bin/env bash
                    set -euo pipefail
                    docker build --pull -t "$API_IMAGE:$IMAGE_TAG" -f Dockerfile .
                    docker build --pull -t "$CLIENT_IMAGE:$IMAGE_TAG" -f client/Dockerfile .
                '''
            }
        }

        stage('Trivy scans') {
            steps {
                sh '''#!/usr/bin/env bash
                    set -euo pipefail
                    mkdir -p reports/trivy
                    trivy fs --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed \
                      --format template --template '@contrib/junit.tpl' \
                      --output reports/trivy/filesystem-junit.xml .
                    trivy image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed \
                      --format template --template '@contrib/junit.tpl' \
                      --output reports/trivy/api-image-junit.xml "$API_IMAGE:$IMAGE_TAG"
                    trivy image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed \
                      --format template --template '@contrib/junit.tpl' \
                      --output reports/trivy/client-image-junit.xml "$CLIENT_IMAGE:$IMAGE_TAG"
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'reports/trivy/*-junit.xml'
                    archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/trivy/**'
                }
            }
        }

        stage('Terraform plan') {
            when { expression { return params.DEPLOY } }
            steps {
                script {
                    if (!params.AWS_KEY_NAME?.trim() || !params.ADMIN_CIDR?.trim()) {
                        error('AWS_KEY_NAME and ADMIN_CIDR are required when DEPLOY is enabled.')
                    }
                }
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDENTIALS}"]]) {
                    dir('terraform') {
                        sh '''#!/usr/bin/env bash
                            set -euo pipefail
                            terraform init -input=false
                            terraform fmt -check
                            terraform validate
                            terraform plan -input=false -out=tfplan \
                              -var "key_name=$AWS_KEY_NAME" \
                              -var "admin_cidr=$ADMIN_CIDR"
                        '''
                    }
                }
            }
        }

        stage('Terraform apply') {
            when { expression { return params.DEPLOY } }
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDENTIALS}"]]) {
                    dir('terraform') {
                        sh '''#!/usr/bin/env bash
                            set -euo pipefail
                            terraform apply -input=false -auto-approve tfplan
                            terraform output -raw public_ip > ../ec2_public_ip.txt
                        '''
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            when { expression { return params.DEPLOY } }
            steps {
                script {
                    env.EC2_PUBLIC_IP = readFile('ec2_public_ip.txt').trim()
                    if (!env.EC2_PUBLIC_IP) {
                        error('Terraform did not return an EC2 public IP.')
                    }
                }
                withCredentials([file(credentialsId: "${PROD_ENV_CREDENTIALS}", variable: 'PRODUCTION_ENV')]) {
                    sshagent(credentials: ["${EC2_SSH_CREDENTIALS}"]) {
                        sh '''#!/usr/bin/env bash
                            set -euo pipefail
                            REMOTE="$EC2_SSH_USER@$EC2_PUBLIC_IP"
                            mkdir -p ~/.ssh
                            ssh-keyscan -H "$EC2_PUBLIC_IP" >> ~/.ssh/known_hosts

                            # A new Terraform instance may need a short time before SSH is ready.
                            for attempt in {1..20}; do
                              if ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE" 'true'; then break; fi
                              if [ "$attempt" -eq 20 ]; then echo 'EC2 did not become reachable over SSH.' >&2; exit 1; fi
                              sleep 15
                            done

                            ssh "$REMOTE" 'sudo dnf install -y docker && sudo systemctl enable --now docker && sudo usermod -aG docker "$USER" && sudo mkdir -p /opt/skillbridge && sudo chown -R "$USER":"$USER" /opt/skillbridge'
                            scp -r Dockerfile docker-compose.yml client server "$REMOTE:/opt/skillbridge/"
                            scp "$PRODUCTION_ENV" "$REMOTE:/opt/skillbridge/.env"
                            ssh "$REMOTE" 'cd /opt/skillbridge && sudo docker compose up -d --build --remove-orphans'
                        '''
                    }
                }
            }
        }

        stage('Deployment smoke test') {
            when { expression { return params.DEPLOY } }
            steps {
                sh '''#!/usr/bin/env bash
                    set -euo pipefail
                    for attempt in {1..12}; do
                      if curl --fail --silent --show-error "http://$EC2_PUBLIC_IP:8080" > /dev/null; then exit 0; fi
                      sleep 10
                    done
                    echo 'Frontend smoke test failed.' >&2
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            archiveArtifacts allowEmptyArchive: true, artifacts: 'client/dist/**, ec2_public_ip.txt'
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
    }
}
