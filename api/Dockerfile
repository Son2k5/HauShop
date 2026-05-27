FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY api/api.csproj api/
RUN dotnet restore api/api.csproj

COPY api/ api/
WORKDIR /src/api
RUN dotnet publish api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
EXPOSE 8443

ENTRYPOINT ["dotnet", "api.dll"]
