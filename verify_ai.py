import os
from ai import get_ai_answer

def test_ai():
    print("Testing AI Agent...")

    # Test 1: Supermarket specific (Rule-based)
    print("\nTest 1: Supermarket specific question")
    ans1 = get_ai_answer("how many products")
    print(f"Q: how many products\nA: {ans1}")

    # Test 2: General question (LLM)
    print("\nTest 2: General question")
    ans2 = get_ai_answer("Hi, who are you?")
    print(f"Q: Hi, who are you?\nA: {ans2}")

    # Test 3: Tanglish (LLM)
    print("\nTest 3: Tanglish question")
    ans3 = get_ai_answer("enna panra?")
    print(f"Q: enna panra?\nA: {ans3}")

if __name__ == "__main__":
    test_ai()
