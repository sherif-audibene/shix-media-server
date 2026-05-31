// Builds from the repo and deploys to a local systemd service on the same box.
// Prerequisites on the Jenkins agent / server (see deploy/DEPLOY.md):
//   - Node 20+ and corepack (for pnpm), system ffmpeg, nginx
//   - The deploy dir owned by the Jenkins user
//   - A sudoers rule allowing: systemctl restart shix-media-server
pipeline {
  agent any

  environment {
    DEPLOY_DIR = '/opt/shix-media-server'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 20, unit: 'MINUTES')
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install') {
      // pnpm is provided system-wide via corepack (set up in deploy/provision.sh).
      steps {
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Verify') {
      steps {
        sh 'pnpm lint'
        sh 'pnpm typecheck'
      }
    }

    stage('Build') {
      steps { sh 'pnpm build' }
    }

    stage('Deploy') {
      steps {
        sh '''
          mkdir -p "$DEPLOY_DIR"
          # Sync build + deps into the live dir. Never touch the server's
          # secrets (.env.local) or its git metadata.
          rsync -a --delete \
            --exclude='.git' \
            --exclude='.env.local' \
            ./ "$DEPLOY_DIR/"

          # Restart via whichever init system is present.
          if [ -d /run/systemd/system ]; then
            sudo /usr/bin/systemctl restart shix-media-server
          else
            sudo /usr/sbin/service shix-media-server restart
          fi
        '''
      }
    }

    stage('Smoke test') {
      steps {
        sh '''
          for i in $(seq 1 30); do
            if curl -fsS -o /dev/null http://127.0.0.1:6302/login; then
              echo "service is up"; exit 0
            fi
            sleep 1
          done
          echo "service did not come up"; exit 1
        '''
      }
    }
  }

  post {
    success { echo "Deployed build #${env.BUILD_NUMBER}" }
    failure { echo 'Deploy failed — previous version still running.' }
  }
}
