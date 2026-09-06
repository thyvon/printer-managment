FROM printer_backend:latest AS backend

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=backend /var/www/html/public /var/www/html/public

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
