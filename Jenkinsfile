#!/usr/bin/env groovy

properties([
  parameters([
    string(name: 'AUTHCLIENTSECRET', defaultValue: 'secret'),
    string(name: 'FLASHMANCLIENTORG', defaultValue: 'anlix'),
    string(name: 'ARTIFACTORYUSER', defaultValue: ''),
    string(name: 'ARTIFACTORYPASS', defaultValue: '')
  ])
])

node {
    checkout scm
    
    stage('Deploy') {
      echo "Deploying...."

      sh """

        echo { > secret.json
        echo \"secret\":${params.AUTHCLIENTSECRET} >> secret.json  
        echo } >> secret.json

        IMGZIP='flashman.zip'

        if [ -f \$IMGZIP ]
        then
            rm \$IMGZIP
        fi

        zip -r \$IMGZIP ./

        curl -u ${params.ARTIFACTORYUSER}:${params.ARTIFACTORYPASS} \\
        -X PUT \"https://artifactory.anlix.io/artifactory/flashman/${params.FLASHMANCLIENTORG}/\"\$IMGZIP \\
        -T \$IMGZIP
      """
    }
}
