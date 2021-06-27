// Global app controller

import Search from './modules/search'
import { elements, renderLoader, clearLoader } from './view/base'
import * as searchView from './view/searchView'
import Recipe from './modules/recipe'
import * as recipeView from './view/recipeView'
import List from './modules/list'
import * as listView from './view/listView'
import Likes from './modules/likes'
import * as likesView from './view/likesView'


/* 
-- Search Object
-- Current Recipe Object
-- Shopping List Object
-- Liked Recipes
*/

const state = {}

/*
    Search Controler
*/

const controlSearch = async () => {
    // 1) Get query from view
    const query = searchView.getInput()

    if(query){
        // 2) New Search Object and add state

        state.search = new Search(query)

        // 3) Prepare UI for results
        
        searchView.clearInput()
        searchView.clearResults()
        renderLoader(elements.searchResList)

        // 4) Search for recipes

        await state.search.getResults()

        // 5) Render results on UI

        clearLoader()
        searchView.renderRecipes(state.search.result)
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault()
    controlSearch()
})

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if(btn){
        const goToPage = +btn.dataset.goto;
        searchView.clearResults()
        window.scroll({
            top: 0,
            left: 0,
            behavior: 'smooth'
        })
        searchView.renderRecipes(state.search.result, goToPage)
    }
})


/*
    Recipe Controler
*/

const controlRecipe = async () => {
    // get ID from url
    const id = window.location.hash.replace('#','')

    if(id){

        // Prepare UI for change
        recipeView.clearRecipe()
        renderLoader(elements.recipe)

        // Selected highlight item
        if(state.search) searchView.highlightSelected(id)

        // Create new recipe Obj
        state.recipe = new Recipe(id)

        try {
            // Get Recipe data
        await state.recipe.getRecipe()

        state.recipe.parseIngredients()

        // Calculate time and servings
        state.recipe.calcTime()
        state.recipe.calcServings()
        
        clearLoader()

        //Render recipe
        recipeView.renderRecipe(state.recipe, state.likes.isLiked(id))

        } catch (error) {
            alert('Error Recipe')
        }
    }
}



/*
List Controller
*/
const controllerList = () => {
    //Create new list
    if(!state.list) state.list = new List()

    //Add each ingredients
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItems(el.count, el.unit, el.ingredient)
        listView.renderItems(item)
    })
}

/* 
Like Controller
*/
const controllerLike = () => {
    if(!state.likes) state.likes = new Likes()

    const currendId = state.recipe.id
    if(!state.likes.isLiked(currendId)){
        //Add like to the state
        const newLike = state.likes.addLike(currendId, state.recipe.title, state.recipe.author, state.recipe.img)
        
        //Toggle button
        likesView.toggleLikeBtn(true)

        // Add Likes UI
        likesView.renderLike(newLike)

    }else{
        //Remove like from state
        state.likes.deleteLike(currendId)

        //Toggle button
        likesView.toggleLikeBtn(false)

        //Remove Like from UI
        likesView.deleteLike(currendId)
    }

    // Toggle Likes Menu
    likesView.toggleLikeMenu(state.likes.getNumLikes())
}


['hashchange', 'load'].forEach(event => window.addEventListener(event,controlRecipe))



// Restore liked recipes on load from storage
window.addEventListener('load', () => {
    state.likes = new Likes()

    // Restore likes
    state.likes.readStorage()

    // Toggle like menu
    likesView.toggleLikeMenu(state.likes.getNumLikes())

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like))
})


// Handling delete and update list items
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        // Delete from state
        state.list.deleteItem(id)
        // Delete from  UI
        listView.deleteItem(id)
    }else if(e.target.matches('.shopping__count__value, .shopping__count__value *')){
        // Update
        const val = +e.target.value
        state.list.updateCount(id,val)
    }
})


// Handling Recipe button

elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //Decrease
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec')
            recipeView.updateServingsIngredients(state.recipe)
        }
    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        //Increase
        state.recipe.updateServings('inc')
        recipeView.updateServingsIngredients(state.recipe)
    }else if(e.target.matches('.recipe__btn__add, .recipe__btn__add *')){
        //Shopping List
        listView.clearItems()
        controllerList()
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        // Like List
        controllerLike()
    }
})