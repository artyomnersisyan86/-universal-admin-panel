### ---- dev ----
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

### ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL=/api
ARG VITE_DEFAULT_LANG=hy
ARG VITE_TINYMCE_API_KEY=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_DEFAULT_LANG=$VITE_DEFAULT_LANG \
    VITE_TINYMCE_API_KEY=$VITE_TINYMCE_API_KEY
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

### ---- prod ----
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
