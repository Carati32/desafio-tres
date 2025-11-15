CREATE DATABASE app_corrida;
USE app_corrida;


CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome_usuario VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(200) NOT NULL,
    avatar_url VARCHAR(255),
    total_atividades INT DEFAULT 0,
    total_calorias INT DEFAULT 0
);
SELECT * FROM usuarios;

CREATE TABLE atividades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo ENUM('Corrida','Caminhada') NOT NULL,
    distancia_km DECIMAL(5,2) NOT NULL,
    duracao_min INT NOT NULL,
    calorias INT NOT NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);

SELECT * FROM atividades