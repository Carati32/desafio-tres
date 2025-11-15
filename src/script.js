const usuario = JSON.parse(localStorage.getItem('usuario'));

if (!usuario) {
    alert("Faça login primeiro!");
    window.location.href = "login.html";
}

document.getElementById("nome_usuario").textContent = usuario.nome_usuario;
document.getElementById("avatar").src = usuario.avatar_url || "../img/default.png";

const lista = document.getElementById("listaAtividades");
const setaEsq = document.getElementById("setaEsq");
const setaDir = document.getElementById("setaDir");
const form = document.getElementById("atividadeForm");

let atividadeEditando = null; 

function atualizarSetas() {
    const scrollLeft = lista.scrollLeft;
    const maxScroll = lista.scrollWidth - lista.clientWidth;

    setaEsq.style.display = scrollLeft > 0 ? "block" : "none";
    setaDir.style.display = scrollLeft < maxScroll ? "block" : "none";
}

setaEsq.addEventListener("click", () => {
    lista.scrollBy({ left: -200, behavior: "smooth" });
});

setaDir.addEventListener("click", () => {
    lista.scrollBy({ left: 200, behavior: "smooth" });
});

lista.addEventListener("scroll", atualizarSetas);
window.addEventListener("load", atualizarSetas);


function criarCard(atividade) {
    const div = document.createElement("div");
    div.classList.add("atividade");

    div.innerHTML = `
        <h4>${atividade.tipo} <span>${atividade.distancia_km} km</span></h4>
        <p>Duração: ${atividade.duracao_min} min</p>
        <p>Calorias: ${atividade.calorias}</p>
        <div class="acoes">
            <button class="editar">Editar</button>
            <button class="excluir">Excluir</button>
        </div>
    `;

    div.querySelector(".excluir").addEventListener("click", async () => {
        await fetch(`http://localhost:3000/atividades/${atividade.id}`, { method: "DELETE" });
        div.remove();
    });

    div.querySelector(".editar").addEventListener("click", async () => {
        let novoTipo = prompt("Digite o novo tipo (Corrida ou Caminhada):", atividade.tipo);
    
        if (novoTipo) {
            novoTipo = novoTipo.charAt(0).toUpperCase() + novoTipo.slice(1).toLowerCase();
        }
    
        if (novoTipo !== "Corrida" && novoTipo !== "Caminhada") {
            alert("Tipo inválido! Só é permitido Corrida ou Caminhada.");
            return;
        }
    
        const novaDistancia = prompt("Digite a nova distância (km):", atividade.distancia_km);
        const novaDuracao = prompt("Digite a nova duração (min):", atividade.duracao_min);
        const novasCalorias = prompt("Digite as novas calorias:", atividade.calorias);
    
        if (novaDistancia && novaDuracao && novasCalorias) {
            const atividadeAtualizada = {
                usuario_id: atividade.usuario_id,
                tipo: novoTipo,
                distancia_km: Number(novaDistancia),
                duracao_min: Number(novaDuracao),
                calorias: Number(novasCalorias)
            };
    
            const res = await fetch(`http://localhost:3000/atividades/${atividade.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(atividadeAtualizada)
            });
    
            if (res.ok) {
                const atualizado = await res.json();
                div.innerHTML = `
                    <h4>${atualizado.tipo} <span>${atualizado.distancia_km} km</span></h4>
                    <p>Duração: ${atualizado.duracao_min} min</p>
                    <p>Calorias: ${atualizado.calorias}</p>
                    <div class="acoes">
                        <button class="editar">Editar</button>
                        <button class="excluir">Excluir</button>
                    </div>
                `;
            } else {
                alert("Erro ao editar atividade");
            }
        }
    });

    return div;
}


async function carregarAtividades() {
    const res = await fetch(`http://localhost:3000/atividades/${usuario.id}`);
    const atividades = await res.json();

    lista.innerHTML = "";
    atividades.forEach(a => {
        lista.appendChild(criarCard(a));
    });

    atualizarSetas();
}

carregarAtividades();

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const atividade = {
        usuario_id: usuario.id,
        tipo: document.getElementById("tipo").value,
        distancia_km: Number(document.getElementById("distancia").value),
        duracao_min: Number(document.getElementById("duracao").value),
        calorias: Number(document.getElementById("calorias").value)
    };

    // Se está editando, faz PUT
    if (atividadeEditando) {
        const id = atividadeEditando.atividade.id;
        const res = await fetch(`http://localhost:3000/atividades/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(atividade)
        });

        if (res.ok) {
            const atualizado = await res.json();
            atividadeEditando.div.replaceWith(criarCard(atualizado));
            atividadeEditando = null;
            form.reset();
        } else {
            alert("Erro ao editar atividade");
        }
    } else {
        const res = await fetch("http://localhost:3000/atividades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(atividade)
        });

        if (res.ok) {
            const nova = await res.json();
            lista.appendChild(criarCard(nova));
            form.reset();

            usuario.total_atividades++;
            usuario.total_calorias += atividade.calorias;

            document.getElementById("total_atividades").innerHTML =
                `${usuario.total_atividades} <span>Qtd. Atividades</span>`;
            document.getElementById("total_calorias").innerHTML =
                `${usuario.total_calorias} <span>Qtd. Calorias</span>`;

            localStorage.setItem("usuario", JSON.stringify(usuario));
            atualizarSetas();
        } else {
            alert("Erro ao registrar atividade");
        }
    }
});



const tabs = document.querySelectorAll(".tabs button");
let filtroAtual = "Todas";

function aplicarFiltro(tipo) {
    filtroAtual = tipo;
    const cards = document.querySelectorAll("#listaAtividades .atividade");
    cards.forEach(card => {
        const titulo = card.querySelector("h4").textContent;
        if (tipo === "Todas" || titulo.includes(tipo)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none"; 
        }
    });
}

tabs.forEach(btn => {
    btn.addEventListener("click", () => {
        tabs.forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        aplicarFiltro(btn.textContent.trim());
    });
});

async function carregarAtividades() {
    const res = await fetch(`http://localhost:3000/atividades/${usuario.id}`);
    const atividades = await res.json();

    lista.innerHTML = "";
    atividades.forEach(a => {
        lista.appendChild(criarCard(a));
    });

    aplicarFiltro(filtroAtual); 
    atualizarSetas();
}

async function carregarUsuario() {
    const res = await fetch(`http://localhost:3000/usuarios/${usuario.id}`);
    const dados = await res.json();

    document.getElementById("total_atividades").innerHTML =
        `${dados.total_atividades} <span>Qtd. Atividades</span>`;
    document.getElementById("total_calorias").innerHTML =
        `${dados.total_calorias} <span>Qtd. Calorias</span>`;

    localStorage.setItem("usuario", JSON.stringify(dados));
}
