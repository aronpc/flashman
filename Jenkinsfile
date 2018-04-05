#!/usr/bin/env groovy

properties([
  parameters([
    string(name: 'AUTHCLIENTSECRET', defaultValue: 'secret'),
    string(name: 'FLASHMANCLIENTORG', defaultValue: 'anlix'),
    string(name: 'ARTIFACTORYUSER', defaultValue: ''),
    string(name: 'ARTIFACTORYPASS', defaultValue: ''),
    string(name: 'MQTTPORT', defaultValue: '1883')
  ])
])

node {
    checkout scm
    
    stage('Deploy') {
      echo "Deploying...."

      sh """

        echo { > secret.json
        echo '"secret":"'${params.AUTHCLIENTSECRET}'"' >> secret.json
        echo } >> secret.json

        echo { > mqtt-port.json
        echo '"port":"'${params.MQTTPORT}'"' >> mqtt-port.json
        echo } >> mqtt-port.json

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
