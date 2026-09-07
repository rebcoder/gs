FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw -ntp -DskipTests dependency:go-offline

COPY src/ src/
RUN ./mvnw -ntp -DskipTests clean package

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/gs-back-0.0.1-SNAPSHOT.jar app.jar
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

EXPOSE 8081
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
