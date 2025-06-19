const apiKey = '12c618006361496396e31d3642ce00a6'; // Replace with your API key

let currentPage = 1;
let query = '';
let dietFilter = '';

document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    query = document.getElementById('search-input').value;
    dietFilter = document.getElementById('diet-filter').value;
    currentPage = 1;
    fetchRecipes(query, currentPage, dietFilter);
});

function fetchRecipes(query, page = 1, diet = '') {
    const offset = (page - 1) * 9;
    let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&query=${query}&number=9&offset=${offset}`;

    if (diet) {
        url += `&diet=${diet}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (!data.results) throw new Error("No results found.");
            setupPagination(data.totalResults);

            // Fetch full recipe information for each result
            const fullDetailsPromises = data.results.map(recipe =>
                fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?includeNutrition=true&apiKey=${apiKey}`)
                    .then(res => res.json())
            );

            return Promise.all(fullDetailsPromises);
        })
        .then(fullRecipes => {
            displayRecipes(fullRecipes);
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Failed to fetch recipes. Please check your API key and internet connection.");
        });
}


function displayRecipes(recipes) {
    const recipeList = document.getElementById('recipe-list');
    recipeList.innerHTML = '';

    recipes.forEach(recipe => {
        const calories = recipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 'N/A';
        const ingredients = recipe.extendedIngredients?.map(i => i.original).join(', ') || 'N/A';

        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe';
        recipeCard.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}">
            <h2>${recipe.title}</h2>
            <p><strong>Calories:</strong> ${Math.round(calories)} kcal</p>
            <p><strong>Ingredients:</strong> ${ingredients}</p>
            <p><a href="${recipe.sourceUrl}" target="_blank">📖 View Instructions</a></p>
            <button onclick="addToFavorites(${recipe.id}, '${recipe.title}', '${recipe.image}')">❤️ Add to Favorites</button>
        `;
        recipeList.appendChild(recipeCard);
    });
}


function saveToFavorites(id, title, image) {
    const favorites = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
    
    if (favorites.some(fav => fav.id === id)) {
        alert('Recipe already in favorites!');
        return;
    }
    
    favorites.push({ id, title, image });
    localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));
    displayFavorites();
}

function displayFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
    const favoriteList = document.getElementById('favorite-recipes');
    favoriteList.innerHTML = '';

    favorites.forEach(fav => {
        const favDiv = document.createElement('div');
        favDiv.classList.add('favorite');

        favDiv.innerHTML = `
            <img src="${fav.image}" alt="${fav.title}">
            <h2>${fav.title}</h2>
            <button onclick="removeFromFavorites('${fav.id}')">Remove from Favorites</button>
        `;

        favoriteList.appendChild(favDiv);
    });
}

function removeFromFavorites(id) {
    let favorites = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
    favorites = favorites.filter(fav => fav.id !== id);
    localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));
    displayFavorites();
}

function setupPagination(totalResults) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(totalResults / 6);
    
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.classList.add('pagination-button');
        button.innerText = i;
        button.addEventListener('click', () => fetchRecipes(query, i, dietFilter));
        
        pagination.appendChild(button);
    }
}

// Initialize favorites on page load
window.onload = function() {
    displayFavorites();
};
