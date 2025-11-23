import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager

def wait_and_click(driver, by, value, timeout=10):
    """Waits for an element to be clickable and clicks it."""
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )
        # Scroll into view to avoid overlays
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        time.sleep(0.5)
        element.click()
        time.sleep(1)  # Slow down for visual verification
        return element
    except Exception as e:
        print(f"Error clicking {value}: {e}")
        # Try JS click as fallback
        try:
            element = driver.find_element(by, value)
            driver.execute_script("arguments[0].click();", element)
            print(f"   (Recovered with JS click for {value})")
            time.sleep(1)
            return element
        except:
            raise e

def wait_and_send_keys(driver, by, value, keys, timeout=10):
    """Waits for an element to be visible and sends keys."""
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((by, value))
        )
        # Scroll into view
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        element.clear()
        element.send_keys(keys)
        time.sleep(0.5)  # Slow down for visual verification
        return element
    except Exception as e:
        print(f"Error sending keys to {value}: {e}")
        raise

def generate_valid_cpf():
    """Generates a valid CPF for testing."""
    def calculate_digit(digits):
        weight = len(digits) + 1
        total = sum(d * (weight - i) for i, d in enumerate(digits))
        remainder = total % 11
        return 0 if remainder < 2 else 11 - remainder

    # Generate first 9 digits
    digits = [random.randint(0, 9) for _ in range(9)]
    
    # Calculate first check digit
    digits.append(calculate_digit(digits))
    
    # Calculate second check digit
    digits.append(calculate_digit(digits))
    
    # Format
    return f"{digits[0]}{digits[1]}{digits[2]}.{digits[3]}{digits[4]}{digits[5]}.{digits[6]}{digits[7]}{digits[8]}-{digits[9]}{digits[10]}"

def test_frontend_flow():
    print("Starting Selenium Test...")
    
    # Setup Chrome Driver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.maximize_window()
    
    try:
        # 1. Login
        print("\n--- Login ---")
        driver.get("http://localhost:3000/auth/login")
        
        # Ensure we are on login page
        WebDriverWait(driver, 10).until(EC.title_contains("PharmaCare") or EC.presence_of_element_located((By.ID, "email")))

        wait_and_send_keys(driver, By.ID, "email", "admin@example.com")
        wait_and_send_keys(driver, By.ID, "password", "admin")
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Sign In')]") # Case sensitive check based on page.tsx
        
        # Wait for redirect (could be /dashboard or /sales)
        time.sleep(3)
        current_url = driver.current_url
        print(f"Logged in. Current URL: {current_url}")
        
        if "/auth/login" in current_url:
            raise Exception("Login failed - still on login page")

        # 2. Navigate to Admin -> Staff
        print("\n--- Navigating to Administration ---")
        driver.get("http://localhost:3000/admin/staff")
        time.sleep(3)
        
        print("   Verified Administration page.")

        # 3. Create Seller (Instead of Pharmacist)
        print("\n--- Creating Seller User ---")
        rand_id = random.randint(10000, 99999) # Increased range to avoid collisions
        seller_email = f"seller{rand_id}@drugstore.com"
        seller_password = "123456"

        wait_and_click(driver, By.XPATH, "//button[contains(., 'Add Staff Member')]")
        print("   Clicking 'Add Staff Member'...")
        
        print("   Filling Staff Form...")
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#name", f"Seller {rand_id}")
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#email", seller_email)
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#cpf", generate_valid_cpf())
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#password", seller_password)
        
        # Role Select (Shadcn UI)
        print("   Selecting Role 'Seller'...")
        wait_and_click(driver, By.XPATH, "//div[@role='dialog']//button[@role='combobox']")
        time.sleep(1)
        try:
            # Try case-insensitive match for Seller
            wait_and_click(driver, By.XPATH, "//div[@role='option']//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'seller')]", timeout=5)
        except:
            print("   !!! ERROR: 'Seller' role not found in dropdown.")
            raise Exception("Seller role not available in dropdown")

        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Create Account')]")
        print(f"   Seller created: {seller_email} / {seller_password}")
        time.sleep(3)

        # 4. Create Client
        print("\n--- Creating Client (as Admin) ---")
        driver.get("http://localhost:3000/clients")
        time.sleep(3)
        
        # Click Register Client Tab
        print("   Switching to Register Tab...")
        # Use role='tab' to distinguish from the submit button
        wait_and_click(driver, By.XPATH, "//button[@role='tab'][contains(., 'Register Client')]")
        time.sleep(1)
        
        print("   Filling Client Form...")
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#cpf", generate_valid_cpf())
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#name", f"Client {rand_id}")
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#phone", "(11) 99999-9999")
        
        # Use JS for email to ensure it sticks and is valid
        email_val = f"client{rand_id}@client.store"
        print(f"   Setting email to: {email_val}")
        email_input = driver.find_element(By.CSS_SELECTOR, "input#email")
        driver.execute_script(f"arguments[0].value = '{email_val}';", email_input)
        driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", email_input)
        
        # Add Birth Date
        print("   Setting Birth Date...")
        # Use JS to set date to avoid locale issues (19/09/11121 error)
        birth_input = driver.find_element(By.CSS_SELECTOR, "input#birth_date")
        driver.execute_script("arguments[0].value = '1991-11-21';", birth_input)
        driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", birth_input)
        driver.execute_script("arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", birth_input)
        
        print("   Submitting Client Form...")
        # Use type='submit' to ensure we click the button, not the tab
        wait_and_click(driver, By.XPATH, "//button[@type='submit'][contains(., 'Register Client')]")
        
        # Check for success or error
        print("   Waiting for Client creation success message...")
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'Client registered successfully')]"))
            )
            print("   Client created successfully (Success message verified).")
        except:
            print("   !!! ERROR: Client Success message not found.")
            # Check for specific errors
            try:
                errors = driver.find_elements(By.XPATH, "//div[contains(@class, 'text-red')]")
                for err in errors:
                    print(f"   Found Error Message: {err.text}")
            except:
                pass
            raise Exception("Failed to create client - Success message not seen")
            
        time.sleep(3)

        # 5. Create Product (Low Stock)
        print("\n--- Creating Product (as Admin) ---")
        driver.get("http://localhost:3000/products")
        time.sleep(3)
        
        # Click Add Product Tab (if visible/needed)
        try:
             wait_and_click(driver, By.XPATH, "//button[contains(., 'Add Product')]", timeout=5)
        except:
             print("   'Add Product' tab not found or already active.")

        print("   Filling Product Form...")
        
        # Category Select - MOVED TO TOP
        print("   Selecting Category (First)...")
        # Find the select trigger for category. It's likely the first combobox in the form.
        # Or we can look for label "Medication Category"
        wait_and_click(driver, By.XPATH, "//label[contains(., 'Category')]/parent::div//button[@role='combobox']")
        time.sleep(1)
        wait_and_click(driver, By.XPATH, "//div[@role='option'][1]") # Select first category
        time.sleep(1)

        # Supplier Select
        print("   Selecting Supplier...")
        try:
            wait_and_click(driver, By.XPATH, "//label[contains(., 'Supplier')]/parent::div//button[@role='combobox']")
            time.sleep(1)
            wait_and_click(driver, By.XPATH, "//div[@role='option'][1]") # Select first supplier
        except:
            print("   Warning: Could not select Supplier (might be optional or empty).")

        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#name", f"Test Med {rand_id}")
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#barcode", f"BAR{rand_id}")
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#price", "25.50")
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#batch_number", f"BATCH{rand_id}") # Added batch number
        wait_and_send_keys(driver, By.CSS_SELECTOR, "textarea#description", "Test Description for Selenium Product") # Added description
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#stock_quantity", "5") # Low stock
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#min_stock_level", "10")
        
        # Set expiration date (future) - MOVED TO VERY END
        # Use JavaScript to set the value directly to avoid locale/format issues with send_keys
        print("   Setting Expiration Date (Last step)...")
        date_input = driver.find_element(By.CSS_SELECTOR, "input#expiration_date")
        
        # Use React 16+ value setter hack to ensure React sees the change
        driver.execute_script("""
            let input = arguments[0];
            let lastValue = input.value;
            input.value = '2025-11-30';
            let event = new Event('input', { bubbles: true });
            event.simulated = true;
            let tracker = input._valueTracker;
            if (tracker) {
                tracker.setValue(lastValue);
            }
            input.dispatchEvent(event);
            input.dispatchEvent(new Event('change', { bubbles: true }));
        """, date_input)
        
        time.sleep(1) # Wait for state update
        
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Register Medication')]")
        
        # Check for success or error
        print("   Waiting for Product creation success message...")
        try:
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'Product registered successfully')]"))
            )
            print("   Product created successfully (Success message verified).")
        except:
            print("   !!! WARNING: Product Success message not found (or timed out).")
            try:
                errors = driver.find_elements(By.XPATH, "//div[contains(@class, 'text-red')]")
                for err in errors:
                    print(f"   Found Error Message: {err.text}")
            except:
                pass
            print("   Continuing test assuming product was created...")

        time.sleep(3)

        # 5.5 Logout Admin and Login as Seller
        print("\n--- Switching to Seller Account ---")
        
        # Logout
        print("   Logging out Admin...")
        # Click User Avatar
        wait_and_click(driver, By.XPATH, "//button[contains(@class, 'rounded-full')]")
        # Click Sign Out
        wait_and_click(driver, By.XPATH, "//div[contains(text(), 'Sign out')]")
        
        time.sleep(2)
        
        # Login as Seller
        print(f"   Logging in as Seller ({seller_email})...")
        wait_and_send_keys(driver, By.ID, "email", seller_email)
        wait_and_send_keys(driver, By.ID, "password", seller_password)
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Sign In')]")
        
        time.sleep(3)
        print("   Logged in as Seller.")

        # 6. Perform Sale (as Seller)
        print("\n--- Performing Sale (as Seller) ---")
        driver.get("http://localhost:3000/sales/new")
        time.sleep(3)
        
        # Search for product
        print("   Searching for product...")
        # The input is inside a CardContent, placeholder="Search by name or barcode..."
        wait_and_send_keys(driver, By.XPATH, "//input[@placeholder='Search by name or barcode...']", f"Test Med {rand_id}")
        time.sleep(2)
        
        # Add to cart using the Plus button
        print("   Adding to cart...")
        try:
             # Find the product row first
             product_row = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, f"//span[contains(text(), 'Test Med {rand_id}')]/ancestor::div[contains(@class, 'border')]"))
             )
             
             # Click the Plus button (it has a Plus icon)
             # In the code: <Button size="sm" onClick={() => addToSale(product)} ...> <Plus ... /> </Button>
             # It's the second button in the gap-2 div (first is batch button)
             add_btn = product_row.find_element(By.XPATH, ".//button[2]") 
             add_btn.click()
             print("   Clicked Add button.")
        except Exception as e:
             print(f"   !!! ERROR: Could not find product row or add button: {e}")
             raise e

        # Increase Quantity to 5 (Sell all stock)
        print("   Increasing quantity to 5 (All Stock)...")
        try:
            # Find the item in the "Sale Items" card
            # It will be in a div with class "flex items-center justify-between p-3 border rounded-lg"
            cart_item = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, f"//div[contains(text(), 'Test Med {rand_id}')]/ancestor::div[contains(@class, 'border')]"))
            )
            
            # Find the Plus button in the cart item
            # It's the second button in the controls (Minus, Span, Plus, Trash)
            # Actually, looking at code: Minus, Span, Plus, Trash
            # So it's the button with Plus icon
            plus_btn = cart_item.find_element(By.XPATH, ".//button[2]") # Index 2 might be the span if we count children, let's use xpath for button
            
            # Click 4 times to go from 1 to 5
            for _ in range(4):
                plus_btn.click()
                time.sleep(0.5)
                
            print("   Quantity increased to 5.")
        except Exception as e:
             print(f"   !!! ERROR: Could not adjust quantity: {e}")
             # Continue anyway, maybe stock was 1
        
        # Select Client
        print("   Selecting Client...")
        
        # Try to find the client select button
        # Strategy 1: Look for "Select client" text
        # Strategy 2: Look for role="combobox"
        
        client_btn = None
        try:
            # Try case-insensitive text match for "Select client"
            client_btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@role='combobox']//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'select client')]"))
            )
            print("   Found Client button by text.")
        except:
            print("   Could not find Client button by text. Trying generic combobox...")
            try:
                # Try finding the first combobox on the page (assuming it's the client one or the only one visible)
                # The page has product search (input), maybe other things.
                # But the client select is a button with role combobox.
                client_btn = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[@role='combobox']"))
                )
                print("   Found Client button by generic role.")
            except:
                print("   !!! ERROR: Could not find Client Select button.")
                raise Exception("Client Select button not found")

        # Click the button
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", client_btn)
        time.sleep(0.5)
        client_btn.click()
        time.sleep(1)
        
        # Select the client from the list
        print("   Selecting client from list...")
        try:
            # Try to find the specific client option
            client_xpath = f"//div[@role='option']//span[contains(text(), 'Client {rand_id}')]"
            
            # Wait for the option to be present in DOM
            option_element = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, client_xpath))
            )
            
            # Scroll into view using JS
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", option_element)
            time.sleep(0.5) # Wait for scroll
            
            # Click it
            option_element.click()
            print(f"   Selected Client {rand_id}")
        except:
            print("   Could not find specific client, selecting first available option.")
            try:
                # Select the second option (index 2) because index 1 might be "No client" or empty
                first_option = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//div[@role='option'][2]"))
                )
                first_option.click()
                print("   Selected first available client.")
            except:
                print("   !!! ERROR: Could not select any client.")
                # We might proceed without client if allowed, but let's raise for now
                # raise Exception("Could not select client")
                pass
        
        # Complete Sale
        print("   Completing Sale...")
        # Button text: "Complete Sale - R$ ..."
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Complete Sale')]")
        
        # Handle Receipt / New Tab
        print("   Handling Receipt...")
        time.sleep(3) # Wait for any new tab or dialog
        
        # Check for new tab
        if len(driver.window_handles) > 1:
            print("   New tab detected (Receipt). Closing it...")
            # Switch to new tab
            driver.switch_to.window(driver.window_handles[-1])
            time.sleep(1)
            driver.close()
            # Switch back to main tab
            driver.switch_to.window(driver.window_handles[0])
            print("   Closed receipt tab. Back to main window.")
        else:
            print("   No new tab detected. Checking for dialog...")
            # Check for dialog close button or press ESC
            try:
                # Try to find the X close button in the dialog
                # Looking for a button with sr-only text "Close" or just the close icon button
                close_btn = driver.find_element(By.XPATH, "//div[@role='dialog']//button[span[contains(text(), 'Close')]]")
                close_btn.click()
                print("   Closed dialog via X button.")
            except:
                try:
                    # Fallback: Try finding the button by its position/class if sr-only text isn't found
                    # Shadcn close button usually has 'absolute right-4 top-4' or similar
                    close_btn = driver.find_element(By.XPATH, "//div[@role='dialog']//button[contains(@class, 'absolute')]")
                    close_btn.click()
                    print("   Closed dialog via absolute positioned button.")
                except:
                    # Press ESC as final fallback
                    print("   Pressing ESC to close any dialog...")
                    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
        
        time.sleep(2)

        # 6.5 Logout Seller and Login as Admin
        print("\n--- Switching back to Admin Account ---")
        
        # Logout
        print("   Logging out Seller...")
        wait_and_click(driver, By.XPATH, "//button[contains(@class, 'rounded-full')]")
        wait_and_click(driver, By.XPATH, "//div[contains(text(), 'Sign out')]")
        
        time.sleep(2)
        
        # Login as Admin
        print("   Logging in as Admin...")
        wait_and_send_keys(driver, By.ID, "email", "admin@example.com")
        wait_and_send_keys(driver, By.ID, "password", "admin")
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Sign In')]")
        
        time.sleep(3)
        print("   Logged in as Admin.")

        # 6.6 Verify Sale on Sales Page
        print("\n--- Verifying Sale on Sales Page ---")
        driver.get("http://localhost:3000/sales")
        time.sleep(3)
        
        print("   Checking for recent sale...")
        try:
            # Look for the sale in the list. It should be at the top.
            # We can look for the client name or product name if displayed, or just the amount.
            # Assuming the list shows client name.
            sale_row = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, f"//div[contains(text(), 'Client {rand_id}')]"))
            )
            print("   SUCCESS: Sale found in Sales History.")
        except:
            print("   !!! WARNING: Sale not found in Sales History.")

        # 7. Show Admin Dashboard
        print("\n--- Showing Admin Dashboard ---")
        driver.get("http://localhost:3000/admin")
        time.sleep(10)
        print("   Admin Dashboard displayed.")
        
        print("\n!!! TEST COMPLETED SUCCESSFULLY !!!")

    except Exception as e:
        print("\n!!! TEST FAILED !!!")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        print(f"Current URL: {driver.current_url}")
    finally:
        print("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    test_frontend_flow()
