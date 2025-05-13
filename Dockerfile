# Usar una imagen base de Node.js
FROM node:16

# Definir el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json al contenedor
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar todo el código fuente al contenedor
COPY . .

# Compilar el proyecto
RUN npm run build

# Exponer el puerto en el que la aplicación escuchará
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "run", "start:prod"]
