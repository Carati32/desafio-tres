import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const pool = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "senai",
  database: "app_corrida"
});

const app = express();
app.use(express.json());
app.use(cors());

app.get("/usuarios", async (req, res) => {
    const { query } = req
    const pagina = Math.max(0, (Number(query.pagina) || 1) - 1)
    const quantidade = Math.max(1, Number(query.quantidade) || 10)
    const offset = pagina * quantidade
  
    try {
      const [usuarios] = await pool.query(
        `SELECT id, nome_usuario, email, senha, avatar_url, total_atividades, total_calorias
         FROM usuarios
         ORDER BY id ASC
         LIMIT ? OFFSET ?`,
        [quantidade, offset]
      )
  
      const [total] = await pool.query(`SELECT COUNT(*) AS total FROM usuarios`)
  
      res.json({
        usuarios,
        total: total[0].total
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })


app.post("/usuarios", async (req, res) => {
  try {
    const { nome_usuario, email, senha, avatar_url } = req.body;

    const [result] = await pool.query(
      "INSERT INTO usuarios (nome_usuario, email, senha, avatar_url) VALUES (?, ?, ?, ?)",
      [nome_usuario, email, senha, avatar_url]
    );

    const [usuarioCriado] = await pool.query(
      "SELECT * FROM usuarios WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(usuarioCriado[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "E-mail já cadastrado!" });
    }
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const [usuario] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ? AND senha = ?",
      [email, senha]
    );

    if (usuario.length > 0) {
      res.json({ message: "Login realizado!", usuario: usuario[0] });
    } else {
      res.status(401).json({ message: "Email ou senha incorretos" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.get("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [usuario] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [id]);

    if (usuario.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json(usuario[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});


app.post("/atividades", async (req, res) => {
  try {
    const { usuario_id, tipo, distancia_km, duracao_min, calorias } = req.body;

    const [result] = await pool.query(
      "INSERT INTO atividades (usuario_id, tipo, distancia_km, duracao_min, calorias) VALUES (?, ?, ?, ?, ?)",
      [usuario_id, tipo, distancia_km, duracao_min, calorias]
    );

    await pool.query(
      "UPDATE usuarios SET total_atividades = total_atividades + 1, total_calorias = total_calorias + ? WHERE id = ?",
      [calorias, usuario_id]
    );

    const [atividadeCriada] = await pool.query(
      "SELECT * FROM atividades WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(atividadeCriada[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao registrar atividade" });
  }
});

app.get("/atividades/:usuario_id", async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const [atividades] = await pool.query(
      "SELECT * FROM atividades WHERE usuario_id = ? ORDER BY data DESC",
      [usuario_id]
    );

    res.json(atividades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar atividades" });
  }
});


app.put("/atividades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, distancia_km, duracao_min, calorias } = req.body;

    await pool.query(
      "UPDATE atividades SET tipo = ?, distancia_km = ?, duracao_min = ?, calorias = ? WHERE id = ?",
      [tipo, distancia_km, duracao_min, calorias, id]
    );

    const [atividadeAtualizada] = await pool.query(
      "SELECT * FROM atividades WHERE id = ?",
      [id]
    );

    res.json(atividadeAtualizada[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao editar atividade" });
  }
});
app.delete("/atividades/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [atividade] = await pool.query("SELECT * FROM atividades WHERE id = ?", [id]);

    if (atividade.length === 0) {
      return res.status(404).json({ message: "Atividade não encontrada" });
    }

    const { usuario_id, calorias } = atividade[0];

    await pool.query("DELETE FROM atividades WHERE id = ?", [id]);

    await pool.query(
      "UPDATE usuarios SET total_atividades = total_atividades - 1, total_calorias = total_calorias - ? WHERE id = ?",
      [calorias, usuario_id]
    );

    res.json({ message: "Atividade excluída com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao excluir atividade" });
  }
});


app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
