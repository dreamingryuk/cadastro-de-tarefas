const urlBase = "http://159.65.228.63";
let todasTarefas = [];
let minhaMatricula = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    console.log("ID recebido pelo GET:", params.get("id"));
    carregarTarefas();

    if (params.has("id")) {
        idEdicao = params.get("id");
        carregarTarefaParaEdicao(idEdicao);
    }
});

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function formatarData(dataBruta) {
    if (!dataBruta) return "Data não encontrada";

    let dataObj = null;

    if (/^\d{2}\/\d{2}\/\d{4}/.test(dataBruta)) {
        const [parteData, parteHora] = dataBruta.split(" ");
        const [dia, mes, ano] = parteData.split("/");
        if (parteHora) {
            dataObj = new Date(`${ano}-${mes}-${dia}T${parteHora}`);
        } else {
            dataObj = new Date(`${ano}-${mes}-${dia}`);
        }
    }
    else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(dataBruta)) {
        dataObj = new Date(dataBruta.replace(" ", "T"));
    }
    else {
        dataObj = new Date(dataBruta);
    }

    if (isNaN(dataObj)) return "Data não encontrada";

    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const horas = String(dataObj.getHours()).padStart(2, '0');
    const minutos = String(dataObj.getMinutes()).padStart(2, '0');
    const segundos = String(dataObj.getSeconds()).padStart(2, '0');

    if (/^\d{4}-\d{2}-\d{2}$/.test(dataBruta) || /^\d{2}\/\d{2}\/\d{4}$/.test(dataBruta)) {
        return `${dia}/${mes}/${ano}`;
    } else if (/:\d{2}:\d{2}$/.test(dataBruta)) {
        return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
    } else {
        return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
    }
}

async function carregarTarefas() {
    const response = await fetch(urlBase + "/tarefas");
    todasTarefas = await response.json();
    todasTarefas.reverse();

    minhaMatricula = localStorage.getItem("minhaMatricula");

    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    todasTarefas.forEach((tarefa, index) => {

        const urgencia = detectarUrgencia(tarefa);
        const dataBruta = tarefa.data || tarefa.data_limite || null;
        const matricula = tarefa.matricula || "—";

        let dataFormatada = formatarData(dataBruta);

        const card = document.createElement("div");
        card.className = "card";
        card.onclick = () => abrirPopup(index);

        const urgNorm = normalizarTexto(urgencia);

        let classeUrgencia = "";
        if (urgNorm.includes("baix")) {
            classeUrgencia = "urgencia-baixa";
        } else if (urgNorm.includes("norm")) {
            classeUrgencia = "urgencia-normal";
        } else if (urgNorm.includes("urg")) {
            classeUrgencia = "urgencia-urgente";
        }

        card.innerHTML = `
            <p class="urgencia ${classeUrgencia}">${urgencia}</p>
            <strong>Data limite:</strong> ${dataFormatada}<br>
            <strong>Matrícula:</strong> ${matricula}
        `;

        const matriculaTarefa = Number(String(tarefa.matricula).trim());
        const matriculaUsuario = Number(String(minhaMatricula).trim());

        if (matriculaTarefa === matriculaUsuario) {
            card.classList.add("seuCard");
        }

        lista.appendChild(card);
    });
}

function detectarUrgencia(tarefa) {
    const chaves = Object.keys(tarefa);

    function norm(txt) {
        return String(txt)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    for (const chave of chaves) {
        const chaveNorm = norm(chave);

        if (chaveNorm.includes("prior") || chaveNorm.includes("urg")) {
            return tarefa[chave];
        }
    }

    for (const chave of chaves) {
        const valor = tarefa[chave];

        if (typeof valor === "string") {
            const valorNorm = norm(valor);
            if (["baixa", "normal", "urgente"].some(v => valorNorm.includes(v))) {
                return valor;
            }
        }
    }

    for (const chave of chaves) {
        if (typeof tarefa[chave] === "string") {
            return tarefa[chave];
        }
    }
    
    return "—";
}

function abrirPopup(index) {
    const popup = document.getElementById("popup");
    const info = document.getElementById("popupInfo");
    const tarefa = todasTarefas[index];

    info.innerHTML = "";

    Object.keys(tarefa).forEach(chave => {
        const linha = document.createElement("p");
        let valor = tarefa[chave];

        if (chave.toLowerCase().includes("recurso")) {

            const divRecursos = document.createElement("div");
            divRecursos.innerHTML = `<strong>${chave}:</strong><br>`;

            if (typeof valor === "string") {
                valor.split(/[,;]+/).forEach(r => {
                    const item = document.createElement("div");
                    item.textContent = "- " + r.trim();
                    divRecursos.appendChild(item);
                });

                info.appendChild(divRecursos);
                return;
            }

            if (Array.isArray(valor)) {
                valor.forEach(r => {
                    const item = document.createElement("div");

                    if (typeof r === "string") {
                        item.textContent = "- " + r;
                    } else if (typeof r === "object" && r !== null) {
                        const chaveObj = Object.keys(r)[0];
                        item.textContent = "- " + r[chaveObj];
                    }

                    divRecursos.appendChild(item);
                });

                info.appendChild(divRecursos);
                return;
            }
        }

        linha.innerHTML = `<strong>${chave}:</strong> ${valor}`;
        info.appendChild(linha);
    });
    //const minhasTarefas = todasTarefas.filter(t => t.matricula === matricula);

    const matriculaTarefa = Number(String(tarefa.matricula).trim());
    const matriculaUsuario = Number(String(minhaMatricula).trim());


    if (matriculaTarefa === matriculaUsuario) {
        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => {
            window.location.href = `editar.html?id=${tarefa.id}`;
        };
        info.appendChild(btnEditar);
    }

    popup.style.display = "flex";
}

document.getElementById("fecharTarefa").onclick = () => {
    document.getElementById("popup").style.display = "none";
};
