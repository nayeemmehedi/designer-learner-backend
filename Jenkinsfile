pipeline {
    agent any

	environment {
		DOCKERHUB_CREDENTIALS=credentials('dockerhub')
        def discordURL = 'https://discord.com/api/webhooks/816669943436542002/ROn0jEWFnbBMbKrxNJbc5bqKTE0S_jjSblSP0DFRJR46MvRbQHN8TXe-bc27V-NgTNYA'
        // URL of image png/jpg to place to right of Discord build notifications
        def discordTImage = 'http://assets.stickpng.com/images/58480984cef1014c0b5e4902.png'    
        def discordImage = 'https://www.nicepng.com/png/full/362-3624869_icon-success-circle-green-tick-png.png'
        def discordDesc = "description\n"
        def discordFooter = "footer desc with vars: ${JOB_BASE_NAME}` (build #${BUILD_NUMBER})`  (tag #${BUILD_TAG})"
        def discordTitle = "${BUILD_NAME} (devel)"
        def username = "Jenkins-Bot"
        def tag = "${BUILD_TAG}"
        def jobBaseName = "${env.JOB_NAME}".split('/').first()
  
	}



post {
    always {
    // discordSend description: "Jenkins Pipeline Build $JOB_BASE_NAME",  footer: " Build Started for ${JOB_NAME} ", link: "$BUILD_URL", result: currentBuild.result, title: "${JOB_NAME}", webhookURL: "https://discord.com/api/webhooks/948167009454161940/1MxQQdk0W84GMMm0S4gaT8Gy8bLKfb-yf5yZluH9p1CxRO3szrWid3spmwZYwCaZCC7E"
        script{
            if ("$JOB_BASE_NAME" == 'dev' || "$JOB_BASE_NAME" == 'main') {
            
                    discordSend webhookURL: discordURL,
                    title: "${JOB_BASE_NAME} #${BUILD_NUMBER}",
                    // title: discordTitle,
                    link: "$BUILD_URL",
                    result: currentBuild.currentResult ,
                    description: "**Pipeline:** ${jobBaseName}  \n**Build:** ${env.BUILD_NUMBER}  \n**Status:** ${currentBuild.currentResult }\n\u2060",  /* word joiner character forces a blank line */
                    enableArtifactsList: true,
                    showChangeset: true,
                    thumbnail: discordTImage,
                    unstable: true,
                    customAvatarUrl: discordTImage,
                    customUsername: username,
                    notes: "Hey <@573161109239103490>,<@723073881228968026>,<@744572220420128788>,<@891932409463988295> the build for  **${jobBaseName}**  --> ${JOB_BASE_NAME}  is done! ",
                    footer: discordFooter
                    // image: discordImage
                    }else {
                    
                }
        }
  
    }
  }


    stages {

        // Production Stages


        // stage('Git Checkout') {
        //     when {
        //         branch 'main'
        //     }
        //     steps {

        //         git branch: 'main', credentialsId: 'jenkins-pipeline', url: 'https://github.com/Edalytix/designerrs-backend.git'

        //     }
        // }

        stage('Building  Docker image For Production') {
            when {
                branch 'main'
            }
            steps {

                sh """ cp envs/prod.env  .env """

                sh """ docker-compose -f docker-compose-traefik.yml build && docker image prune -f """

                sh """ echo "Build Succesfully" """
            }
        }


		stage('Login to Docker hub PROD') {
            when {
                branch 'main'
            }

			steps {
				sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'

                sh """ echo "Login Succesfully" """

			}
		}

        stage('Push Docker image For Production') {
            when {
                branch 'main'
            }
            steps {

                sh """ docker push adminedal/designerrs:apis   """

                sh """ echo "Pushed image Succesfully" """

            }
        }



        stage('Building  Docker image For Dev') {
            when {
                branch 'main'
            }
            steps {

                sh """ docker-compose  -f docker-compose-traefik.yml up -d """

                sh """ echo "Build Succesfully" """
            }
        }


        stage('Starting  Production  Container ') {
            when {
                branch 'main'
            }
            steps {
                sh """ docker ps --latest """
            }
        }


    }
}
