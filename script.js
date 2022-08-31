const client = contentful.createClient({
	// This is the space ID. A space is like a project folder in Contentful terms
	space: "7gz1tghsl58p",
	// This is the access token for this space. Normally you get both ID and the token in the Contentful web app
	accessToken: "GZcJtea09z28m-3YZVq2kNTSLVxOACLF8wnwT4-JyAI",
});

const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

// cart
let cart = [];
// buttons
let buttonsDOM = [];

// getting products
class Products {
	async getProducts() {
		try {
			let contentful = await client.getEntries({
				content_type: "productTest",
			});

			let result = await fetch("products.json");
			let data = await result.json();
			let products = contentful.items;
			products = products.map((item) => {
				const { title, price } = item.fields;
				const { id } = item.sys;
				const image = item.fields.image.fields.file.url;
				return { title, price, id, image };
			});
			return products;
		} catch (error) {
			console.log(error);
		}
	}
}

// Display products

class UI {
	displayProducts(products) {
		let result = "";
		products.forEach((product) => {
			result += `
            <article class="product">
					<div class="img-container">
						<img
							src="${product.image}"
							alt="product1"
							srcset=""
							class="product-img"
						/>
						<button class="bag-btn" data-id="${product.id}">
							<i class="bx bx-shopping-bag bx-xs"></i>Add to cart
						</button>
					</div>
					<h3>${product.title}</h3>
					<h4>$${product.price}</h4>
				</article>
            `;
		});
		productsDOM.innerHTML = result;
	}

	getBagButtons() {
		const buttons = [...document.querySelectorAll(".bag-btn")];
		buttonsDOM = buttons;
		buttons.forEach((button) => {
			let id = button.dataset.id;
			let inCart = cart.find((item) => item.id === id);
			if (inCart) {
				button.innerText = "In Cart";
				button.disabled = true;
			}
			button.addEventListener("click", (event) => {
				event.target.innerText = "In Cart";
				event.target.disabled = true;
				// get product from products local storage
				let cartItem = { ...Storage.getProduct(id), amount: 1 }; // this means to get the product but also add a new property of amount in it

				// add products to the cart
				cart = [...cart, cartItem];

				// save cart in local storage
				Storage.saveCart(cart);

				// set cart  values
				this.setCartValues(cart);

				// display cart item
				this.addCartItem(cartItem);

				// show the cart
				this.showCart();
			});
		});
	}

	setCartValues(cart) {
		let tempTotal = 0;
		let itemsTotal = 0;
		cart.map((item) => {
			tempTotal += item.price * item.amount;
			itemsTotal += item.amount;
		});
		cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
		cartItems.innerText = itemsTotal;
	}

	addCartItem(item) {
		const div = document.createElement("div");
		div.classList.add("cart-item");
		div.innerHTML = `
        <img src="${item.image}" alt="" srcset="" />
						<div>
							<h4>${item.title}</h4>
							<h5>$${item.price}</h5>
							<span class="remove-item" data-id="${item.id}">remove</span>
						</div>
						<div>
							<i class="bx bxs-chevron-up" data-id="${item.id}"></i>
							<p class="item-amount">${item.amount}</p>
							<i class="bx bxs-chevron-down" data-id="${item.id}"></i>
						</div>
        `;
		cartContent.appendChild(div);
	}

	showCart() {
		cartOverlay.classList.add("transparentBcg");
		cartDOM.classList.add("showCart");
	}

	setupAPP() {
		cart = Storage.getCart();
		this.setCartValues(cart);
		this.populateCart(cart);
		cartBtn.addEventListener("click", this.showCart);
		closeCartBtn.addEventListener("click", this.hideCart);
	}

	populateCart(cart) {
		cart.forEach((item) => this.addCartItem(item));
	}

	hideCart() {
		cartOverlay.classList.remove("transparentBcg");
		cartDOM.classList.remove("showCart");
	}

	cartLogic() {
		// Clear cart Button
		clearCartBtn.addEventListener("click", () => {
			this.clearCart();
		});
		// Cart Functionality
		cartContent.addEventListener("click", (event) => {
			if (event.target.classList.contains("remove-item")) {
				let removeItem = event.target;
				let id = removeItem.dataset.id;
				cartContent.removeChild(removeItem.parentElement.parentElement);
				this.removeItem(id);
			} else if (event.target.classList.contains("bxs-chevron-up")) {
				let addAmount = event.target;
				let id = addAmount.dataset.id;
				let tempItem = cart.find((item) => item.id === id);
				tempItem.amount = tempItem.amount + 1;
				Storage.saveCart(cart);
				this.setCartValues(cart);
				addAmount.nextElementSibling.innerText = tempItem.amount;
			} else if (event.target.classList.contains("bxs-chevron-down")) {
				let minusAmount = event.target;
				let id = minusAmount.dataset.id;
				let tempItem = cart.find((item) => item.id === id);
				tempItem.amount = tempItem.amount - 1;
				if (tempItem.amount > 0) {
					Storage.saveCart(cart);
					this.setCartValues(cart);
					minusAmount.previousElementSibling.innerText = tempItem.amount;
				} else {
					cartContent.removeChild(minusAmount.parentElement.parentElement);
					this.removeItem(id);
				}
			}
		});
	}

	clearCart() {
		let cartItems = cart.map((item) => item.id);
		cartItems.forEach((id) => this.removeItem(id));
		while (cartContent.children.length > 0) {
			cartContent.removeChild(cartContent.children[0]);
		}
		this.hideCart();
	}

	removeItem(id) {
		cart = cart.filter((item) => item.id !== id);
		this.setCartValues(cart);
		Storage.saveCart(cart);
		let button = this.getSingleButton(id);
		button.disabled = false;
		button.innerHTML = `<i class="bx bx-shopping-bag bx-xs"></i>Add to cart`;
	}

	getSingleButton(id) {
		return buttonsDOM.find((button) => button.dataset.id === id);
	}
}

// local storage
class Storage {
	static saveProducts(products) {
		localStorage.setItem("products", JSON.stringify(products));
	}

	static getProduct(id) {
		let products = JSON.parse(localStorage.getItem("products"));
		return products.find((product) => product.id === id);
	}

	static saveCart(cart) {
		localStorage.setItem("cart", JSON.stringify(cart));
	}

	static getCart() {
		return localStorage.getItem("cart")
			? JSON.parse(localStorage.getItem("cart"))
			: [];
		//if there is an item in cart, return cart items from local storage, if nothing, return empty array
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const ui = new UI();
	const products = new Products();

	// setup app
	ui.setupAPP();

	// get all products
	products
		.getProducts()
		.then((products) => {
			ui.displayProducts(products);
			Storage.saveProducts(products);
		})
		.then(() => {
			ui.getBagButtons();
			ui.cartLogic();
		});
});
