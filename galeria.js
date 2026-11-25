const uploadDialog = document.getElementById("upload-dialog");
const detailsDialog = document.getElementById("details-dialog");
const deleteDialog = document.getElementById("delete-dialog");
const galleryStatus = document.getElementById("gallery-status");
const memoryGrid = document.getElementById("memory-grid");
const galleryEmpty = document.getElementById("gallery-empty");
const uploadForm = document.getElementById("upload-form");
const cameraInput = document.getElementById("memory-camera");
const imageInput = document.getElementById("memory-image");
const imagePreview = document.getElementById("image-preview");
const selectedImageName = document.getElementById("selected-image-name");
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const CONTRIBUTOR_NAMES = {
    ele: "Guilherme Lindao",
    ela: "Veronica Delicinha"
};
let selectedImage = null;
let previewObjectUrl = null;
let selectedMemory = null;
let pendingDeletion = null;

function getSupabaseConfig() {
    const config = window.ENTRE_NOS_SUPABASE_CONFIG;
    if (!config || typeof config.url !== "string" || typeof config.anonKey !== "string") {
        return null;
    }

    const url = config.url.trim().replace(/\/+$/, "");
    const anonKey = config.anonKey.trim();
    return url && anonKey ? { url, anonKey } : null;
}

function setGalleryStatus(message, state) {
    galleryStatus.textContent = message;
    galleryStatus.dataset.state = state || "info";
}

function showFormError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.hidden = !message;
}

async function supabaseRequest(path, options) {
    const config = getSupabaseConfig();
    if (!config) {
        throw new Error("A integração Supabase ainda não foi configurada no arquivo supabase-config.js.");
    }

    const response = await fetch(`${config.url}${path}`, {
        ...options,
        headers: {
            apikey: config.anonKey,
            Authorization: `Bearer ${config.anonKey}`,
            ...(options && options.headers ? options.headers : {})
        }
    });

    if (!response.ok) {
        const responseBody = await response.text();
        let detail = responseBody;
        try {
            const parsedBody = JSON.parse(responseBody);
            detail = parsedBody.message || parsedBody.error_description || parsedBody.error || responseBody;
        } catch (error) {
            detail = responseBody;
        }
        throw new Error(`Supabase (${response.status}): ${detail || response.statusText}`);
    }

    return response;
}

function publicImageUrl(storagePath) {
    const config = getSupabaseConfig();
    const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
    return `${config.url}/storage/v1/object/public/album-fotos/${encodedPath}`;
}

function formatMemoryDate(value) {
    if (!value) {
        return "";
    }
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date);
}

function setMemoryDetails(memory) {
    selectedMemory = memory;
    const imageUrl = publicImageUrl(memory.storage_path);
    const detailsImage = document.getElementById("details-image");
    detailsImage.src = imageUrl;
    detailsImage.alt = memory.title || "Foto da nossa memória";
    document.getElementById("details-title").textContent = memory.title || "Um momento nosso";
    document.getElementById("details-description").textContent = memory.description || "Um pedacinho da nossa história.";

    const metadata = [
        ["Local", memory.location],
        ["Data", formatMemoryDate(memory.taken_at)],
        ["Guardada por", memory.created_by],
        ["Adicionada", memory.created_at ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(memory.created_at)) : ""]
    ].filter((item) => item[1]);
    const metadataList = document.getElementById("details-meta");
    metadataList.replaceChildren();
    metadata.forEach(([label, value]) => {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        row.append(term, description);
        metadataList.append(row);
    });

    const downloadButton = document.getElementById("download-memory");
    downloadButton.dataset.url = imageUrl;
    downloadButton.download = memory.storage_path.split("/").pop() || "memoria.jpg";
    document.getElementById("download-error").hidden = true;
    detailsDialog.showModal();
}

function renderMemories(memories) {
    memoryGrid.replaceChildren();
    galleryEmpty.hidden = memories.length > 0;
    memories.forEach((memory, index) => {
        const card = document.createElement("button");
        const image = document.createElement("img");
        const caption = document.createElement("span");
        card.type = "button";
        card.className = "memory-card";
        card.style.setProperty("--tilt", `${[-2.2, 1.8, -1.2, 2.4, -1.7][index % 5]}deg`);
        card.setAttribute("aria-label", `Abrir memória: ${memory.title || "Um momento nosso"}`);
        image.src = publicImageUrl(memory.storage_path);
        image.alt = memory.title || "Foto da nossa memória";
        image.loading = "lazy";
        caption.className = "memory-card-caption";
        caption.textContent = memory.title || "Um momento nosso";
        card.append(image, caption);
        card.addEventListener("click", () => setMemoryDetails(memory));
        memoryGrid.append(card);
    });
}

async function loadMemories() {
    if (!getSupabaseConfig()) {
        setGalleryStatus("O armazenamento da galeria ainda não foi configurado.", "error");
        renderMemories([]);
        return;
    }

    setGalleryStatus("Carregando as lembranças...", "info");
    try {
        const query = new URLSearchParams({
            select: "id,title,description,location,taken_at,created_by,storage_path,created_at",
            order: "created_at.desc"
        });
        const response = await supabaseRequest(`/rest/v1/memories?${query}`, { method: "GET" });
        const memories = await response.json();
        renderMemories(memories);
        setGalleryStatus(`${memories.length} ${memories.length === 1 ? "memória guardada" : "memórias guardadas"}.`, "success");
    } catch (error) {
        console.error("Falha ao carregar as memórias.", error);
        setGalleryStatus(`Não foi possível carregar a galeria. ${error.message}`, "error");
        renderMemories([]);
    }
}

function updateSelectedImage(file) {
    if (!file) {
        return;
    }

    selectedImage = file;
    selectedImageName.textContent = file.name;
    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
    }
    previewObjectUrl = URL.createObjectURL(file);
    imagePreview.src = previewObjectUrl;
    imagePreview.hidden = false;
}

function resetImageSelection() {
    selectedImage = null;
    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");
    selectedImageName.textContent = "Escolha como adicionar sua foto";
    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }
}

document.getElementById("take-photo").addEventListener("click", () => cameraInput.click());
document.getElementById("choose-photo").addEventListener("click", () => imageInput.click());
cameraInput.addEventListener("change", () => updateSelectedImage(cameraInput.files[0]));
imageInput.addEventListener("change", () => updateSelectedImage(imageInput.files[0]));

uploadForm.querySelectorAll('input[name="added_by"]').forEach((radio) => {
    radio.addEventListener("change", () => {
        document.getElementById("who-preview").textContent = `${CONTRIBUTOR_NAMES[radio.value]} colocou esta lembrança.`;
    });
});

document.getElementById("open-upload").addEventListener("click", () => {
    if (!getSupabaseConfig()) {
        setGalleryStatus("O armazenamento precisa ser configurado nos arquivos do projeto antes do envio.", "error");
        return;
    }
    uploadForm.reset();
    resetImageSelection();
    document.getElementById("who-preview").textContent = "Selecione quem está adicionando a lembrança.";
    showFormError("upload-error", "");
    uploadDialog.showModal();
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
});

[uploadDialog, detailsDialog, deleteDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
});

document.getElementById("delete-memory").addEventListener("click", () => {
    if (!selectedMemory) {
        return;
    }

    if (!pendingDeletion || pendingDeletion.memory.id !== selectedMemory.id) {
        pendingDeletion = { memory: selectedMemory, metadataDeleted: false };
    }
    document.getElementById("delete-memory-title").textContent = selectedMemory.title || "esta lembrança";
    document.getElementById("confirm-delete").textContent = pendingDeletion.metadataDeleted
        ? "Tentar apagar a foto"
        : "Sim, excluir memória";
    showFormError("delete-error", "");
    deleteDialog.showModal();
});

document.getElementById("confirm-delete").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const deletion = pendingDeletion;
    if (!deletion) {
        showFormError("delete-error", "Selecione uma memória antes de confirmar.");
        return;
    }

    button.disabled = true;
    button.textContent = "Apagando...";
    showFormError("delete-error", "");
    try {
        if (!deletion.metadataDeleted) {
            const query = new URLSearchParams({
                id: `eq.${deletion.memory.id}`,
                select: "id"
            });
            const response = await supabaseRequest(`/rest/v1/memories?${query}`, {
                method: "DELETE",
                headers: { Prefer: "return=representation" }
            });
            const deletedRows = await response.json();
            if (deletedRows.length !== 1) {
                throw new Error("A memória não foi encontrada no banco de dados.");
            }
            deletion.metadataDeleted = true;
        }

        await supabaseRequest("/storage/v1/object/album-fotos", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prefixes: [deletion.memory.storage_path] })
        });

        pendingDeletion = null;
        deleteDialog.close();
        detailsDialog.close();
        await loadMemories();
        setGalleryStatus("A memória foi removida do varal. Sentiremos saudade dela. 💔", "success");
    } catch (error) {
        console.error("Falha ao excluir a memória.", error);
        const partialDeleteMessage = deletion.metadataDeleted
            ? " A lembrança já saiu do álbum, mas a foto ainda está no armazenamento. Verifique a política de exclusão do Storage e tente novamente."
            : "";
        showFormError("delete-error", `Não foi possível concluir a exclusão. ${error.message}${partialDeleteMessage}`);
    } finally {
        button.disabled = false;
        button.textContent = pendingDeletion && pendingDeletion.metadataDeleted
            ? "Tentar apagar a foto"
            : "Sim, excluir memória";
    }
});

uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedImage || !ALLOWED_IMAGE_TYPES.includes(selectedImage.type)) {
        showFormError("upload-error", "Tire uma foto ou escolha uma imagem JPG, PNG, GIF ou WebP.");
        return;
    }
    if (selectedImage.size > MAX_IMAGE_SIZE) {
        showFormError("upload-error", "A imagem precisa ter no máximo 10 MB.");
        return;
    }

    const contributor = uploadForm.querySelector('input[name="added_by"]:checked');
    if (!contributor) {
        showFormError("upload-error", "Selecione quem está guardando a lembrança.");
        return;
    }

    const saveButton = document.getElementById("save-memory");
    saveButton.disabled = true;
    saveButton.textContent = "Guardando...";
    showFormError("upload-error", "");
    const extension = selectedImage.type.split("/")[1].replace("jpeg", "jpg");
    const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    let imageUploaded = false;

    try {
        await supabaseRequest(`/storage/v1/object/album-fotos/${encodeURIComponent(storagePath)}`, {
            method: "POST",
            headers: {
                "Content-Type": selectedImage.type,
                "x-upsert": "false"
            },
            body: selectedImage
        });
        imageUploaded = true;

        const memory = {
            title: uploadForm.elements.title.value.trim(),
            description: uploadForm.elements.description.value.trim(),
            location: uploadForm.elements.location.value.trim(),
            taken_at: uploadForm.elements.taken_at.value || null,
            created_by: CONTRIBUTOR_NAMES[contributor.value],
            storage_path: storagePath
        };
        await supabaseRequest("/rest/v1/memories", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Prefer: "return=minimal"
            },
            body: JSON.stringify(memory)
        });
        uploadDialog.close();
        await loadMemories();
    } catch (error) {
        console.error("Falha ao guardar a memória.", error);
        const orphanNote = imageUploaded ? " A foto chegou ao armazenamento, mas os detalhes não foram salvos; tente enviar novamente depois." : "";
        showFormError("upload-error", `Não foi possível guardar a foto. ${error.message}${orphanNote}`);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Guardar no varal";
    }
});

document.getElementById("download-memory").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const downloadError = document.getElementById("download-error");
    button.textContent = "Preparando...";
    button.disabled = true;
    downloadError.hidden = true;
    try {
        const response = await fetch(button.dataset.url);
        if (!response.ok) {
            throw new Error(`O servidor respondeu ${response.status}.`);
        }
        const objectUrl = URL.createObjectURL(await response.blob());
        const downloadLink = document.createElement("a");
        downloadLink.href = objectUrl;
        downloadLink.download = button.download;
        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
        console.error("Falha ao baixar a foto.", error);
        downloadError.textContent = `Não foi possível baixar a foto. ${error.message}`;
        downloadError.hidden = false;
    } finally {
        button.textContent = "↓ Baixar foto";
        button.disabled = false;
    }
});

loadMemories();
