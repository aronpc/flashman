FROM node:6

# APP information
MAINTAINER anlix "guisenges@gmail.com"

ENV FLM_MQTT_BROKER "mqtt://"
ENV FLM_IMG_RELEASE_DIR "./public/firmwares/"
ENV FLM_ALLOW_DEV_UPDATE_REST_DATA false
ENV FLM_MONGODB_HOST "localhost"
ENV FLM_ADM_USER "admin"
ENV FLM_ADM_PASS "flashman"

WORKDIR /app

COPY ./app.js ./LICENSE ./package.json ./docker/environment.config.json /app/
COPY ./bin /app/bin
COPY ./controllers /app/controllers
COPY ./models /app/models
COPY ./public /app/public
COPY ./routes /app/routes
COPY ./views /app/views

# Run as root
RUN chown -R node:node /app
RUN npm install pm2 -g

# Run as user node
USER node
RUN npm install --production

EXPOSE 8000

CMD [ "pm2-docker", "start", "environment.config.json" ]
